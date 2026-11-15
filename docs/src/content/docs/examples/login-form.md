---
title: Login Form
description: Store composition — TextInput + Action child stores, coordinated validation
---

A login form demonstrating **store composition**, **reactive coordination** with `autorun`, and **validation**.

## Features used

- `store.mount()` for child stores (TextInput, Action)
- `store.autorun()` for reactive coordination
- `onChange` callbacks between parent and children
- Validation logic in the parent store

## Store

```typescript
// loginForm/store.ts
import { defineStore } from "@asimojs/mom";
import { TextInput } from "../textInput/store";
import { Action } from "../action/store";

export const LoginForm = defineStore((store) => {
    const model = store.initModel({
        login: store.mount(TextInput, {
            mandatory: true,
            onChange() {
                this.setError(false);  // `this` is bound to the TextInput model
            },
        }),
        password: store.mount(TextInput, {
            mandatory: true,
            password: true,
            onChange() {
                this.setError(false);
            },
        }),
        loginAction: store.mount(Action, {
            text: "Login",
            disabled: true,
            onAction: submit,
        }),
        submit() {
            submit();
        },
    });

    function submit() {
        if (model.loginAction.disabled) return;

        if (model.password.value.length < 8) {
            model.password.setErrorMessage("Password must be at least 8 characters");
            return;
        }

        // TODO: call login API
    }

    // Reactive coordination: enable login button when both fields have values
    store.autorun(() => {
        model.loginAction.setDisabled(
            model.login.value === "" || model.password.value === ""
        );
    });

    return model;
});

export type LoginFormStore = ReturnType<typeof LoginForm>;
```

### Key patterns

**Inline `store.mount()`** — child stores are created directly in the `initModel` call. This works because `mount` returns synchronously.

**`onChange` with `this` binding** — the `onChange` callback receives the TextInput model as `this`, letting the input clear its own error without the parent needing a reference:

```typescript
onChange() {
    this.setError(false);  // `this` = the TextInput model
}
```

**`autorun` coordination** — whenever `login.value` or `password.value` change, the autorun fires and updates the action's disabled state. This is reactive — no manual event wiring.

**Validation in `submit()`** — the parent reads child values and sets errors on specific children:

```typescript
if (model.password.value.length < 8) {
    model.password.setErrorMessage("Password must be at least 8 characters");
}
```

**Return-model pattern** — this store uses the `defineStore` overload that infers the model type from the return value instead of a separate `StoreDef` type. The store type is derived with `ReturnType<typeof LoginForm>`.

## View

```tsx
// loginForm/store.view.tsx
import { observer } from "mobx-react-lite";
import { LoginFormStore } from "./store";

export const LoginFormView = observer(({ store }: { store: LoginFormStore }) => (
    <form onSubmit={(e) => { e.preventDefault(); store.submit(); }}>
        <div>
            <label>Login</label>
            <input
                value={store.login.value}
                onChange={(e) => store.login.setValue(e.target.value)}
                disabled={store.login.disabled}
            />
            {store.login.error && <span>{store.login.errorMessage}</span>}
        </div>

        <div>
            <label>Password</label>
            <input
                type={store.password.showPassword ? "text" : "password"}
                value={store.password.value}
                onChange={(e) => store.password.setValue(e.target.value)}
                disabled={store.password.disabled}
            />
            {store.password.error && <span>{store.password.errorMessage}</span>}
        </div>

        <button
            type="submit"
            disabled={store.loginAction.disabled}
        >
            {store.loginAction.text}
        </button>
    </form>
));
```

## Test

```typescript
import { createStore, disposeStore } from "@asimojs/mom";
import { LoginForm } from "./store";

describe("LoginForm", () => {
    it("should enable login when both fields filled", () => {
        const store = createStore(LoginForm);

        expect(store.loginAction.disabled).toBe(true);

        store.login.setValue("admin");
        expect(store.loginAction.disabled).toBe(true);  // password empty

        store.password.setValue("secret123");
        expect(store.loginAction.disabled).toBe(false);

        disposeStore(store);
    });

    it("should validate password length", () => {
        const store = createStore(LoginForm);

        store.login.setValue("admin");
        store.password.setValue("short");
        store.submit();

        expect(store.password.error).toBe(true);
        expect(store.password.errorMessage).toBe("Password must be at least 8 characters");

        disposeStore(store);
    });

    it("should clear error on input change", () => {
        const store = createStore(LoginForm);

        store.login.setValue("admin");
        store.password.setValue("short");
        store.submit();
        expect(store.password.error).toBe(true);

        store.password.setValue("newvalue");
        expect(store.password.error).toBe(false);

        disposeStore(store);
    });
});
```

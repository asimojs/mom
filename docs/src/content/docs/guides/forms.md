---
title: Building Forms
description: Composing TextInput, Action, and form stores for coordinated validation
---

Forms are a natural fit for HMVVM — each input field is a child store, and the form store coordinates validation and submission.

## Pattern overview

A form store typically:
1. **Mounts child stores** for each input field and action button
2. **Coordinates** them via `autorun` or `reaction` (e.g. enable/disable submit)
3. **Implements submission logic** that reads child values and validates

## TextInput store

A reusable input field store managing value, validation state, and visibility:

```typescript
// textInput/store.ts
import { defineStore } from "@asimojs/mom";

export const TextInput = defineStore((store, params: {
    value?: string;
    disabled?: boolean;
    mandatory?: boolean;
    password?: boolean;
    onChange?: (this: TextInputModel) => void;
}) => {
    let onChange = params.onChange ?? (() => {});

    const model = store.initModel({
        value: params.value ?? "",
        disabled: params.disabled ?? false,
        error: false,
        errorMessage: "",
        mandatory: params.mandatory ?? false,
        password: params.password ?? false,
        showPassword: false,

        setValue(value: string) {
            model.value = value;
            onChange.call(model);
        },
        setDisabled(disabled: boolean) { model.disabled = disabled; },
        setError(error: boolean) {
            model.error = error;
            if (!error) model.errorMessage = "";
        },
        setErrorMessage(msg: string) {
            model.errorMessage = msg;
            if (msg) model.error = true;
        },
        setMandatory(mandatory: boolean) { model.mandatory = mandatory; },
        toggleShowPassword() { model.showPassword = !model.showPassword; },
        setOnChange(fn: () => void) { onChange = fn; },
    });
    return model;
});
```

## Action store

A reusable button/action store:

```typescript
// action/store.ts
import { defineStore } from "@asimojs/mom";

export const Action = defineStore((store, params: {
    text?: string;
    disabled?: boolean;
    onAction?: () => void;
}) => {
    const model = store.initModel({
        text: params.text ?? "",
        disabled: params.disabled ?? false,
        error: false,
        errorMessage: "",
        onAction: params.onAction ?? (() => {}),

        run() {
            if (!model.disabled) model.onAction();
        },
        setText(text: string) { model.text = text; },
        setDisabled(disabled: boolean) { model.disabled = disabled; },
        setError(error: boolean) {
            model.error = error;
            if (!error) model.errorMessage = "";
        },
        setErrorMessage(msg: string) {
            model.errorMessage = msg;
            if (msg) model.error = true;
        },
        setOnAction(fn: () => void) { model.onAction = fn; },
    });
    return model;
});
```

## LoginForm: composing child stores

The form store mounts children and coordinates them:

```typescript
// loginForm/store.ts
import { defineStore } from "@asimojs/mom";
import { TextInput } from "../textInput/store";
import { Action } from "../action/store";

export const LoginForm = defineStore((store) => {
    const model = store.initModel({
        login: store.mount(TextInput, {
            mandatory: true,
            onChange() { this.setError(false); },
        }),
        password: store.mount(TextInput, {
            mandatory: true,
            password: true,
            onChange() { this.setError(false); },
        }),
        loginAction: store.mount(Action, {
            text: "Login",
            disabled: true,
            onAction: submit,
        }),
        submit() { submit(); },
    });

    function submit() {
        if (model.loginAction.disabled) return;
        if (model.password.value.length < 8) {
            model.password.setErrorMessage("Password must be at least 8 characters");
            return;
        }
        // Call API, navigate, etc.
    }

    // Reactive coordination: enable login only when both fields have values
    store.autorun(() => {
        model.loginAction.setDisabled(
            model.login.value === "" || model.password.value === ""
        );
    });

    return model;
});
```

### Key patterns demonstrated

- **`onChange` callback** — each input clears its own error when the user types, using `this` bound to the input model
- **`autorun` coordination** — the form reactively enables/disables the submit button based on child state
- **Validation in `submit()`** — the parent reads child values and sets errors on specific children
- **`store.mount()` in `initModel`** — children can be mounted directly in the model declaration

## View

The form view simply passes child stores to their views:

```tsx
export const LoginFormView = observer(({ store }: { store: LoginFormStore }) => (
    <form onSubmit={(e) => { e.preventDefault(); store.submit(); }}>
        <TextInputView store={store.login} label="Login" />
        <TextInputView store={store.password} label="Password" />
        <ActionView store={store.loginAction} />
    </form>
));
```

Each child view is an independent `observer` — it only re-renders when its own store changes.

## Testing forms

Test the form by exercising child stores through the parent:

```typescript
it("should disable submit when fields are empty", async () => {
    const store = createStore(LoginForm);
    await store.$initComplete;

    expect(store.loginAction.disabled).toBe(true);

    store.login.setValue("user");
    expect(store.loginAction.disabled).toBe(true);  // password still empty

    store.password.setValue("12345678");
    expect(store.loginAction.disabled).toBe(false);

    disposeStore(store);
});
```

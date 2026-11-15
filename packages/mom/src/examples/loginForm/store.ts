import { defineStore } from "@/mom";
import { TextInput } from "../textInput/store";
import { Action } from "../action/store";

export const LoginForm = defineStore((store) => {
    const model = store.initModel({
        login: store.mount(TextInput, {
            mandatory: true,
            onChange() {
                this.setError(false);
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
        if (model.loginAction.disabled) {
            return;
        }
        if (model.password.value.length < 8) {
            model.password.setErrorMessage("Password must be at least 8 characters");
            return;
        }
        // TODO Submit the login form (e.g., call an API)
    }

    store.autorun(() => {
        model.loginAction.setDisabled(model.login.value === "" || model.password.value === "");
    });

    return model;
});

export type LoginFormStore = ReturnType<typeof LoginForm>;

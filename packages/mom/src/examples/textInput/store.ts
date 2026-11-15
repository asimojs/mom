import { defineStore } from "@/mom";

export interface TextInputModel {
    value: string;
    disabled: boolean;
    error: boolean;
    errorMessage: string;
    mandatory: boolean;
    password: boolean;
    showPassword: boolean;
    setValue(value: string): void;
    setDisabled(disabled: boolean): void;
    setError(error: boolean): void;
    setErrorMessage(errorMessage: string): void;
    setMandatory(mandatory: boolean): void;
    toggleShowPassword(): void;
    setOnChange(fn: (this: TextInputModel) => void): void;
}

export const TextInput = defineStore(
    (
        store,
        params: {
            value?: string;
            disabled?: boolean;
            error?: boolean;
            errorMessage?: string;
            mandatory?: boolean;
            password?: boolean;
            onChange?: (this: TextInputModel) => void;
        },
    ) => {
        const errorMessage = params.errorMessage ?? "";
        const error = errorMessage ? true : (params.error ?? false);
        let onChange: (this: TextInputModel) => void = params.onChange ?? (() => {});

        const model = store.initModel({
            value: params.value ?? "",
            disabled: params.disabled ?? false,
            error,
            errorMessage,
            mandatory: params.mandatory ?? false,
            password: params.password ?? false,
            showPassword: false,

            /** Update the input value and notify via onChange */
            setValue(value: string) {
                model.value = value;
                onChange.call(model);
            },
            /** Enable or disable the input */
            setDisabled(disabled: boolean) {
                model.disabled = disabled;
            },
            /** Set or clear the error flag (clears errorMessage when false) */
            setError(error: boolean) {
                model.error = error;
                if (!error) {
                    model.errorMessage = "";
                }
            },
            /** Set the error message (sets error to true when non-empty) */
            setErrorMessage(errorMessage: string) {
                model.errorMessage = errorMessage;
                if (errorMessage) {
                    model.error = true;
                }
            },
            /** Mark the field as mandatory or optional */
            setMandatory(mandatory: boolean) {
                model.mandatory = mandatory;
            },
            /** Toggle password visibility */
            toggleShowPassword() {
                model.showPassword = !model.showPassword;
            },
            /** Replace the onChange callback */
            setOnChange(fn: (this: TextInputModel) => void) {
                onChange = fn;
            },
        });
        return model;
    },
);

export type TextInputStore = ReturnType<typeof TextInput>;

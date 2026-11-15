import { defineStore } from "@/mom";

export const Action = defineStore(
    (
        store,
        params: {
            text?: string;
            disabled?: boolean;
            error?: boolean;
            errorMessage?: string;
            onAction?: () => void;
        },
    ) => {
        const errorMessage = params.errorMessage ?? "";
        const error = errorMessage ? true : (params.error ?? false);

        const model = store.initModel({
            text: params.text ?? "",
            disabled: params.disabled ?? false,
            error,
            errorMessage,
            onAction: params.onAction ?? (() => {}),

            /** Executes the action when all conditions are met (e.g. not disabled) */
            run() {
                if (!model.disabled) {
                    model.onAction();
                }
            },
            /** Update the button label */
            setText(text: string) {
                model.text = text;
            },
            /** Enable or disable the action */
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
            /** Replace the action callback */
            setOnAction(onAction: () => void) {
                model.onAction = onAction;
            },
        });
        return model;
    },
);

export type ActionStore = ReturnType<typeof Action>;

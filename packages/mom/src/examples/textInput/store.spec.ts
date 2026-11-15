import { describe, expect, it } from "vitest";
import { createStore, disposeStore } from "@/mom";
import { TextInput } from "./store";

describe("TextInput", () => {
    describe("Default values", () => {
        it("should initialize with defaults when no params provided", () => {
            const store = createStore(TextInput);
            expect(store.value).toBe("");
            expect(store.disabled).toBe(false);
            expect(store.error).toBe(false);
            expect(store.errorMessage).toBe("");
            expect(store.mandatory).toBe(false);
            expect(store.password).toBe(false);
            expect(store.showPassword).toBe(false);
            disposeStore(store);
        });

        it("should initialize with provided params", () => {
            const store = createStore(TextInput, {
                value: "hello",
                disabled: true,
                error: true,
                errorMessage: "required field",
                mandatory: true,
            });
            expect(store.value).toBe("hello");
            expect(store.disabled).toBe(true);
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("required field");
            expect(store.mandatory).toBe(true);
            disposeStore(store);
        });
    });

    describe("Setters", () => {
        it("should update value", () => {
            const store = createStore(TextInput);
            store.setValue("new value");
            expect(store.value).toBe("new value");
            disposeStore(store);
        });

        it("should update disabled", () => {
            const store = createStore(TextInput);
            store.setDisabled(true);
            expect(store.disabled).toBe(true);
            disposeStore(store);
        });

        it("should update mandatory", () => {
            const store = createStore(TextInput);
            store.setMandatory(true);
            expect(store.mandatory).toBe(true);
            disposeStore(store);
        });
    });

    describe("Password", () => {
        it("should initialize as password field", () => {
            const store = createStore(TextInput, { password: true });
            expect(store.password).toBe(true);
            expect(store.showPassword).toBe(false);
            disposeStore(store);
        });

        it("should toggle showPassword", () => {
            const store = createStore(TextInput, { password: true });
            store.toggleShowPassword();
            expect(store.showPassword).toBe(true);
            store.toggleShowPassword();
            expect(store.showPassword).toBe(false);
            disposeStore(store);
        });
    });

    describe("Params consistency", () => {
        it("should force error to true when errorMessage is provided", () => {
            const store = createStore(TextInput, { errorMessage: "oops" });
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });

        it("should force error to true even when error param is false", () => {
            const store = createStore(TextInput, { error: false, errorMessage: "oops" });
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });

        it("should clear errorMessage when error param is false", () => {
            const store = createStore(TextInput, { error: false, errorMessage: "" });
            expect(store.error).toBe(false);
            expect(store.errorMessage).toBe("");
            disposeStore(store);
        });
    });

    describe("onChange", () => {
        it("should call onChange when setValue is called", () => {
            const values: string[] = [];
            const store = createStore(TextInput, {
                onChange() {
                    values.push(this.value);
                },
            });
            store.setValue("hello");
            store.setValue("world");
            expect(values).toEqual(["hello", "world"]);
            disposeStore(store);
        });

        it("should not throw when onChange is not provided", () => {
            const store = createStore(TextInput);
            store.setValue("hello");
            expect(store.value).toBe("hello");
            disposeStore(store);
        });

        it("should update onChange via setOnChange", () => {
            const values1: string[] = [];
            const values2: string[] = [];
            const store = createStore(TextInput, {
                onChange() {
                    values1.push(this.value);
                },
            });
            store.setValue("a");
            store.setOnChange(function () {
                values2.push(this.value);
            });
            store.setValue("b");
            expect(values1).toEqual(["a"]);
            expect(values2).toEqual(["b"]);
            disposeStore(store);
        });

        it("should provide access to the model via this", () => {
            let capturedError = false;
            const store = createStore(TextInput, {
                error: true,
                onChange() {
                    capturedError = this.error;
                },
            });
            store.setValue("test");
            expect(capturedError).toBe(true);
            disposeStore(store);
        });
    });

    describe("Error / errorMessage sync", () => {
        it("should set error to true when errorMessage is set", () => {
            const store = createStore(TextInput);
            expect(store.error).toBe(false);

            store.setErrorMessage("something went wrong");
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("something went wrong");
            disposeStore(store);
        });

        it("should not change error when errorMessage is cleared", () => {
            const store = createStore(TextInput, { error: true, errorMessage: "oops" });

            store.setErrorMessage("");
            expect(store.errorMessage).toBe("");
            expect(store.error).toBe(true);
            disposeStore(store);
        });

        it("should clear errorMessage when error is set to false", () => {
            const store = createStore(TextInput, { error: true, errorMessage: "oops" });

            store.setError(false);
            expect(store.error).toBe(false);
            expect(store.errorMessage).toBe("");
            disposeStore(store);
        });

        it("should not clear errorMessage when error is set to true", () => {
            const store = createStore(TextInput, { errorMessage: "oops" });

            store.setError(true);
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });
    });
});

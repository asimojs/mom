import { describe, expect, it } from "vitest";
import { createStore, disposeStore } from "@/mom";
import { Action } from "./store";

describe("Action", () => {
    describe("Default values", () => {
        it("should initialize with defaults when no params provided", () => {
            const store = createStore(Action);
            expect(store.text).toBe("");
            expect(store.disabled).toBe(false);
            expect(store.error).toBe(false);
            expect(store.errorMessage).toBe("");
            expect(typeof store.onAction).toBe("function");
            disposeStore(store);
        });

        it("should initialize with provided params", () => {
            let called = false;
            const store = createStore(Action, {
                text: "Submit",
                disabled: true,
                error: true,
                errorMessage: "not allowed",
                onAction: () => { called = true; },
            });
            expect(store.text).toBe("Submit");
            expect(store.disabled).toBe(true);
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("not allowed");

            store.onAction();
            expect(called).toBe(true);
            disposeStore(store);
        });
    });

    describe("Setters", () => {
        it("should update text", () => {
            const store = createStore(Action);
            store.setText("Click me");
            expect(store.text).toBe("Click me");
            disposeStore(store);
        });

        it("should update disabled", () => {
            const store = createStore(Action);
            store.setDisabled(true);
            expect(store.disabled).toBe(true);
            disposeStore(store);
        });

        it("should update onAction", () => {
            let value = 0;
            const store = createStore(Action);
            store.setOnAction(() => { value = 42; });
            store.onAction();
            expect(value).toBe(42);
            disposeStore(store);
        });
    });

    describe("run", () => {
        it("should call onAction when run is called", () => {
            let called = false;
            const store = createStore(Action, { onAction: () => { called = true; } });
            store.run();
            expect(called).toBe(true);
            disposeStore(store);
        });

        it("should not call onAction when disabled", () => {
            let called = false;
            const store = createStore(Action, { disabled: true, onAction: () => { called = true; } });
            store.run();
            expect(called).toBe(false);
            disposeStore(store);
        });

        it("should call updated onAction after setOnAction", () => {
            let value = 0;
            const store = createStore(Action);
            store.setOnAction(() => { value = 42; });
            store.run();
            expect(value).toBe(42);
            disposeStore(store);
        });
    });

    describe("Params consistency", () => {
        it("should force error to true when errorMessage is provided", () => {
            const store = createStore(Action, { errorMessage: "oops" });
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });

        it("should force error to true even when error param is false", () => {
            const store = createStore(Action, { error: false, errorMessage: "oops" });
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });
    });

    describe("Error / errorMessage sync", () => {
        it("should set error to true when errorMessage is set", () => {
            const store = createStore(Action);
            store.setErrorMessage("something went wrong");
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("something went wrong");
            disposeStore(store);
        });

        it("should not change error when errorMessage is cleared", () => {
            const store = createStore(Action, { error: true, errorMessage: "oops" });
            store.setErrorMessage("");
            expect(store.errorMessage).toBe("");
            expect(store.error).toBe(true);
            disposeStore(store);
        });

        it("should clear errorMessage when error is set to false", () => {
            const store = createStore(Action, { error: true, errorMessage: "oops" });
            store.setError(false);
            expect(store.error).toBe(false);
            expect(store.errorMessage).toBe("");
            disposeStore(store);
        });

        it("should not clear errorMessage when error is set to true", () => {
            const store = createStore(Action, { errorMessage: "oops" });
            store.setError(true);
            expect(store.error).toBe(true);
            expect(store.errorMessage).toBe("oops");
            disposeStore(store);
        });
    });
});

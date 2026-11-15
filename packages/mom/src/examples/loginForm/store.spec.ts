import { describe, expect, it } from "vitest";
import { createStore, disposeStore } from "@/mom";
import { LoginForm } from "./store";

describe("LoginForm", () => {
    describe("Default state", () => {
        it("should have empty fields and disabled login button", () => {
            const store = createStore(LoginForm);
            expect(store.login.value).toBe("");
            expect(store.password.value).toBe("");
            expect(store.loginAction.disabled).toBe(true);
            disposeStore(store);
        });
    });

    describe("Login button enabled/disabled", () => {
        it("should enable login button when both fields are non-empty", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("pass1234");
            expect(store.loginAction.disabled).toBe(false);
            disposeStore(store);
        });

        it("should disable login button when login is cleared", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("pass1234");
            expect(store.loginAction.disabled).toBe(false);

            store.login.setValue("");
            expect(store.loginAction.disabled).toBe(true);
            disposeStore(store);
        });

        it("should disable login button when password is cleared", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("pass1234");
            expect(store.loginAction.disabled).toBe(false);

            store.password.setValue("");
            expect(store.loginAction.disabled).toBe(true);
            disposeStore(store);
        });
    });

    describe("Validation", () => {
        it("should set error on password when password is too short", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("short");
            store.loginAction.run();
            expect(store.password.error).toBe(true);
            expect(store.password.errorMessage).toBe("Password must be at least 8 characters");
            disposeStore(store);
        });

        it("should not set error when password is valid", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("longpassword");
            store.loginAction.run();
            expect(store.password.error).toBe(false);
            expect(store.password.errorMessage).toBe("");
            disposeStore(store);
        });

        it("should clear password error when password is edited", () => {
            const store = createStore(LoginForm);
            store.login.setValue("user");
            store.password.setValue("short");
            store.loginAction.run();
            expect(store.password.error).toBe(true);

            store.password.setValue("newvalue");
            expect(store.password.error).toBe(false);
            expect(store.password.errorMessage).toBe("");
            disposeStore(store);
        });

        it("should clear login error when login is edited", () => {
            const store = createStore(LoginForm);
            store.login.setErrorMessage("some error");
            expect(store.login.error).toBe(true);

            store.login.setValue("user");
            expect(store.login.error).toBe(false);
            expect(store.login.errorMessage).toBe("");
            disposeStore(store);
        });
    });
});

import {
    Form,
    Field,
    FormElement
} from "@progress/kendo-react-form";

import { Input } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../services/AuthService";

interface SignUpFormData {
    mail: string;
    password: string;
    confirmPassword: string;
}

const emailValidator = (value: string) => {
    if (!value) {
        return "Email is required";
    }

    if (!/\S+@\S+\.\S+/.test(value)) {
        return "Enter a valid email";
    }

    return "";
};

const passwordValidator = (value: string) => {
    if (!value) {
        return "Password is required";
    }

    if (value.length < 6) {
        return "Password must be at least 6 characters";
    }

    return "";
};

const EmailField = (fieldRenderProps: any) => {
    const {
        validationMessage,
        visited,
        ...others
    } = fieldRenderProps;

    return (
        <div className="mb-4">
            <Input
                {...others}
                label="Email"
                className="w-full"
            />

            {visited && validationMessage && (
                <div className="mt-1 text-sm text-red-600">
                    {validationMessage}
                </div>
            )}
        </div>
    );
};

const PasswordField = (fieldRenderProps: any) => {
    const {
        validationMessage,
        visited,
        ...others
    } = fieldRenderProps;

    return (
        <div className="mb-4">
            <Input
                {...others}
                type="password"
                label="Password"
                className="w-full"
            />

            {visited && validationMessage && (
                <div className="mt-1 text-sm text-red-600">
                    {validationMessage}
                </div>
            )}
        </div>
    );
};

export default function SignUp() {
    const navigate = useNavigate();

    const handleSubmit = async (
        values: { [name: string]: any }
    ) => {

        try {

            if (values.password !== values.confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            const data: SignUpFormData = {
                mail: values.mail,
                password: values.password,
                confirmPassword: values.confirmPassword
            };

            const response = await signup({
                mail: data.mail,
                password: data.password
            });

            navigate("/login");

            console.log("Signup successful:", response);

        } catch (error: any) {

            console.error(error);

            alert(
                error.response?.data ??
                "Unable to create account"
            );
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">

                <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">Sign Up</h1>

                <Form
                    onSubmit={handleSubmit}
                    render={(formRenderProps) => (

                        <FormElement>

                            <Field
                                name="mail"
                                component={EmailField}
                                validator={emailValidator}
                            />

                            <Field
                                name="password"
                                component={PasswordField}
                                validator={passwordValidator}
                            />

                            <Field
                                name="confirmPassword"
                                component={PasswordField}
                                validator={passwordValidator}
                            />

                            <Button
                                type="submit"
                                themeColor="primary"
                                disabled={!formRenderProps.allowSubmit}
                                className="w-full"
                            >
                                Sign Up
                            </Button>

                        </FormElement>

                    )}
                />

                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                </p>

            </div>
        </div>
    );
}

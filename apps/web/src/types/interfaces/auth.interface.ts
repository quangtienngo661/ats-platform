import { IAuth } from "@ats-platform/types";

export interface ISignIn extends IAuth {
    password: string;
}

// export interface ISignUp extends IAuth {
//     password: string;
//     fullName: string;
//     phoneNumber: string;
//     role: string;
// }

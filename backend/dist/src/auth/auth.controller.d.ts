import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(body: any): Promise<{
        access_token: string;
        user: any;
    }>;
    requestPasswordReset(body: any): Promise<{
        message: string;
        mock_otp: string;
    }>;
    resetPassword(body: any): Promise<{
        message: string;
    }>;
    changePassword(req: any, body: any): Promise<{
        message: string;
    }>;
}

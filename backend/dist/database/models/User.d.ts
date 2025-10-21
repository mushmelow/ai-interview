import { User as UserType, CreateUserData, UpdateUserData } from '../../types';
export declare class User implements UserType {
    id: number;
    email: string;
    passwordHash: string;
    role: 'admin' | 'candidate' | 'interviewer';
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    constructor(data: any);
    static create(userData: CreateUserData): Promise<User>;
    static findById(id: number): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static update(userId: number, updateData: UpdateUserData): Promise<User>;
    delete(): Promise<boolean>;
    static findAll(limit?: number, offset?: number): Promise<User[]>;
}
export default User;
//# sourceMappingURL=User.d.ts.map
// src/types.ts
export interface MatchedUser {
    launchName: string;
    launchId: string;
    loginDate: string;
    userId: string;
    name?: string;
    activityType?: string;
    surname?: string;
    phoneNumber?: string;
    email?: string;
    duty?: string;
    visitor_company_name?: string;
    isVisitor?: boolean;
    companyId?: string;
    role?: string; // Add the role property
    companyName?: string; // Yeni alan
    country?: string; // Yeni alan
    language?: string; // Yeni alan
}
export interface DamiseUserResponse {
    id: string;
    role: string;
    token: string;
    // Eğer başka alanlar da varsa buraya ekleyin
}
export interface S3File {
    groupName: string;
    key: string;
    lastModified: string;
    size: number;
    url: string;
}

export type ThreeRegionLayout = 'three-a-top' | 'three-side-right' | 'three-columns';
export type RegionLayout = 'single' | 'two-horizontal' | 'two-vertical' | 'three-a-top' | 'three-side-right' | 'three-columns' | 'four';

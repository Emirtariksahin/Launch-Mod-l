// src/types.ts
export interface S3File {
    groupName: string;
    key: string;
    lastModified: string;
    size: number;
    url: string;
}
export interface DamiseUserResponse {
    id: string;
    role: string;
    token: string;
    // Eğer başka alanlar da varsa buraya ekleyin
}
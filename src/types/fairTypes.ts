export interface IName {
    en: string;
    tr: string;
}

export interface ICompanyWithLimit {
    logo: { url: string; key: string };
    about?: IName;
    _id: string;
    name: string;
}

export interface IBadge {
    _id: string;
    name: IName;
    explanation: IName;
    createdAt: string;
    updatedAt: string;
    __v: 0;
    constituent: string;
    image: string;
}

export interface IFair {
    products: { _id: string; product: IProduct }[];
    services: { _id: string; service: IService }[];
    participation: { _id: string; companyId: IParticipation }[];
}

export interface IProduct {
    _id: string;
    mainImage: string;
    is_new: boolean;
    name: IName;
    slug: IName;
    company: ICompanyWithLimit;
}

export interface IService {
    _id: string;
    name: IName;
    slug: IName;
    images: string[];
    mainImage: string;
    company: ICompanyWithLimit;
    is_new: boolean;
}

export interface IParticipation {
    _id: string;
    name: string;
    badge: IBadge[];
    about: IName;
    logo: {
        url: string;
        key: string;
    };
    slug: IName;
    trailerVideo?: string;
    promotionImages?: string[];
    promotionImagesEn?: string[];
}

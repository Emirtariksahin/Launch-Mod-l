import axios from "axios";

const DAMISE_API_URL = process.env.REACT_APP_DAMISE_API_URL;

interface ProductOrServiceResponse {
    name?: {
        tr?: string;
        en?: string;
    };
    company?: {
        name?: string;
    };
}

// Product detaylarını çekmek için servis
export const fetchProductDetails = async (productId: string) => {
    try {
        // ID'yi temizle
        const cleanProductId = productId.trim();

        // 2000ms gecikme ekleyerek API çağrısını yap
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data } = await axios.get<ProductOrServiceResponse>(
            `${DAMISE_API_URL}/utils/product/${cleanProductId}`
           
        );

        return {
            detailName: data.name?.tr || "-", // Eğer veri yoksa "-"
            companyName: data.company?.name || "-", // Eğer veri yoksa "-"
        };
    } catch (error) {
        console.error(`Error fetching product details for productId ${productId}:`, error);
        return { detailName: "-", companyName: "-" }; // Hata durumunda "-"
    }
};

// Service detaylarını çekmek için servis
export const fetchServiceDetails = async (serviceId: string) => {
    try {
        const cleanServiceId = serviceId.trim();
        // 2000ms gecikme ekleyerek API çağrısını yap
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data } = await axios.get<ProductOrServiceResponse>(
            `${DAMISE_API_URL}/utils/service/${cleanServiceId}`
            
        );
        return {
            detailName: data.name?.tr || "-", // Eğer veri yoksa "-"
            companyName: data.company?.name || "-", // Eğer veri yoksa "-"
        };
    } catch (error) {
        console.error(`Error fetching service details for serviceId ${serviceId}:`, error);
        return { detailName: "-", companyName: "-" }; // Hata durumunda "-"
    }
};
export const fetchComponentDetails = async (componentId: string) => {
    try {
        const { data } = await axios.get<{ componentName?: string; componentData?: { reportDescription?: string } }>(
            `${process.env.REACT_APP_API_URL}/component/${componentId}`
        );

        return {
            componentName: data.componentName || null,
            reportDescription: data.componentData?.reportDescription || null, // reportDescription alanını ekledik
        };
    } catch {
        return {
            componentName: null,
            reportDescription: null, // Hata durumunda null döner
        };
    }
};

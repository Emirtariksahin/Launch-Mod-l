import axios from "axios";

const API_BASE_URL = "https://api-ekosistem.damise.com";
import { MatchedUser } from "../types";


// Login ve token alma
export const loginAndGetToken = async () => {
    try {
        console.log("Login işlemi başlatılıyor...");
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
            email: "lansman@damise.com",
            password: "DamisE1234*DL",
        });

        // Tüm headers'ları loglayın
        console.log("Yanıt headers:", response.headers);

        const token = response.headers["x-auth"] || response.headers["X-Auth"] || response.headers["x-auth".toLowerCase()];

        if (!token) {
            console.error("x-auth bulunamadı. Headers:", response.headers);
            throw new Error("Token alınamadı.");
        }

        console.log("Token başarıyla alındı:", token);
        return token;
    } catch (error: any) {
        console.error("Login işlemi sırasında hata:", error.response?.data || error.message);
        throw new Error("Token alınamadı. Giriş bilgilerini kontrol edin.");
    }
};
export const getCompanyDetailsFromAPI = async (
    companyId: string
): Promise<{ companyName: string; country: string }> => {
    try {
        const response = await axios.get<{
            name: string;
            address: { country: { name: string } };
        }>(`${API_BASE_URL}/utils/company/${companyId}`);
        const data = response.data;

        return {
            companyName: data.name,
            country: data.address?.country?.name || "Bilinmiyor", // Doğru alandan veriyi alıyoruz
        };
    } catch (error: any) {
        console.error("Company API Hatası:", error.response?.data || error.message);
        throw error;
    }
};


// Kullanıcı bilgilerini alma
export const getUserDetailsFromNewAPI = async (
    userId: string,
    token: string
): Promise<MatchedUser> => {
    try {
        console.log("Gönderilen Token:", token);

        const response = await axios.get<ApiResponse>(`${API_BASE_URL}/users/getuser`, {
            params: { userid: userId },
            headers: {
                "x-auth": token,
                "Content-Type": "application/json",
            },
        });

        const data = response.data.info;

        return {
            name: data.name,
            surname: data.surname,
            phoneNumber: data.phoneNumber,
            email: data.email,
            companyId: data.company,
            role: data.role, // Eklenmesi gereken alanlar
            userId: data._id, // Eklenmesi gereken alanlar
            visitor_company_name: data.visitor_company_name,
            isVisitor: data.isVisitor,
            duty: data.duty,
            country: data.country,

            launchName: "", // Varsayılan değerler
            launchId: "",
            loginDate: "",
        };
    } catch (error: any) {
        if (error.response) {
            console.error("API Yanıt Hatası:", error.response.data);
        } else {
            console.error("Hata:", error.message);
        }
        throw error;
    }
};
interface ApiResponse {
    info: {
        _id: string;
        name: string;
        surname: string;
        phoneNumber: string;
        email: string;
        company: string;
        duty: string;
        visitor_company_name: string;
        isVisitor: boolean;
        country: string;
        [key: string]: any; // Diğer alanlar için
    };
}

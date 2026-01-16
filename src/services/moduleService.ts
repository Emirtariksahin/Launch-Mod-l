import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = Cookies.get('adminToken');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export interface Module {
    name: string;
    source: string;
    entryPage: string;
}

export interface ModuleChanges {
    added: string[];
    modified: Array<{ path: string; lineDiff: number }>;
    deleted: string[];
}

export const moduleApi = {
    // Tüm modülleri listele
    async getModules(): Promise<Module[]> {
        const response = await axios.get<{ success: boolean; modules: Module[] }>(
            `${API_URL}/modules/list`,
            getAuthHeaders()
        );
        return response.data.modules;
    },

    // Modül değişikliklerini getir
    async getDiff(moduleName: string): Promise<ModuleChanges> {
        const response = await axios.get<{ success: boolean; changes: ModuleChanges }>(
            `${API_URL}/modules/${moduleName}/diff`,
            getAuthHeaders()
        );
        return response.data.changes;
    },

    // Push işlemi
    async push(moduleName: string): Promise<{ message: string; output: string }> {
        const response = await axios.post<{ success: boolean; message: string; output: string }>(
            `${API_URL}/modules/${moduleName}/push`,
            {},
            getAuthHeaders()
        );
        return response.data;
    },

    // Pull işlemi
    async pull(moduleName: string): Promise<{ message: string; output: string }> {
        const response = await axios.post<{ success: boolean; message: string; output: string }>(
            `${API_URL}/modules/${moduleName}/pull`,
            {},
            getAuthHeaders()
        );
        return response.data;
    },

    // GitHub Push
    async githubPush(moduleName: string, repoUrl: string): Promise<{ message: string; output: string }> {
        const response = await axios.post<{ success: boolean; message: string; output: string }>(
            `${API_URL}/modules/${moduleName}/github/push`,
            { repoUrl },
            getAuthHeaders()
        );
        return response.data;
    },

    // GitHub Pull
    async githubPull(moduleName: string, repoUrl: string): Promise<{ message: string; output: string }> {
        const response = await axios.post<{ success: boolean; message: string; output: string }>(
            `${API_URL}/modules/${moduleName}/github/pull`,
            { repoUrl },
            getAuthHeaders()
        );
        return response.data;
    }
};

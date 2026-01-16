import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

interface Launch {
    _id: string;
    launchName: string;
    language: string;
}


export const fetchLaunchDetails = async (launchId: string): Promise<{ launchName: string; language: string }> => {
    try {
        const response = await axios.get<Launch>(`${API_URL}/launch/${launchId}`);
        return { launchName: response.data.launchName, language: response.data.language };
    } catch (error) {
        console.error(`Error fetching launch details for ID ${launchId}:`, error);
        return { launchName: "-", language: "-" };
    }
};


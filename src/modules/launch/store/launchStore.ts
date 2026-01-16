import create from 'zustand';
import { S3File } from '../services/types';

export interface LaunchData {
  active: boolean;
  _id: string;
  launchName: string;
  language: string;
  groupNumber: string;
  companyName: string;
  companyLogo: string;
  startDate: string;
  endDate: string;
  orderNumber: string;
  isActive: boolean;
  showOnHomepage: boolean;
  showOnVisitform: boolean; // Bu alanı ekliyoruz
  logo?: S3File; // Eğer logo özelliğini eklemeniz gerekiyorsa
  ecosystemCompanyId: string;
}

interface LaunchStore {
  formData: LaunchData;
  setFormData: (data: Partial<LaunchData>) => void;
  resetFormData: () => void;
}

const useLaunchStore = create<LaunchStore>((set) => ({
  formData: {
    active: false, // Başlangıç değeri eklendi
    _id: '',
    launchName: '',
    language: '',
    groupNumber: '',
    companyName: '',
    companyLogo: '',
    startDate: '',
    endDate: '',
    orderNumber: '',
    isActive: false,
    showOnHomepage: false,
    showOnVisitform:false,
    ecosystemCompanyId: '',
    logo: undefined, // Başlangıç değeri eklendi
  },
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetFormData: () =>
    set({
      formData: {
        active: false, // Başlangıç değeri eklendi
        _id: '',
        launchName: '',
        language: '',
        groupNumber: '',
        companyName: '',
        companyLogo: '',
        startDate: '',
        endDate: '',
        orderNumber: '',
        isActive: false,
        showOnHomepage: false,
        showOnVisitform:false,
        ecosystemCompanyId: '',
        logo: undefined, // Başlangıç değeri eklendi
      },
    }),
}));

export default useLaunchStore;

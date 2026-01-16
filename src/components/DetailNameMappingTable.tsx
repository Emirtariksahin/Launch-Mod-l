import React, { useState } from "react"; // ✅ Correctly import React and useState

export const detailNameMappings: { [key: string]: string } = {
    "Company Header Card": "Firma Başlığı",
    "Company Large Scalable Card": "Firma Tanıtım Görseli",
    "Company Full Text Card": "Firma Hakkında",
    "Company Large Popup Card": "Firma Tanıtım Videosu",
    "Company Product Card": "Ürün Kartları",
    "Company Service Card": "Hizmet Kartları",
};

export const DetailNameTable: React.FC = () => {
    const [mappings, setMappings] = useState<{ [key: string]: string }>(detailNameMappings); // ✅ Correctly typed state

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Detail Name Mapping Tablosu</h2>
            <table className="table-auto border-collapse w-full text-left">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border px-4 py-2">Orijinal Detail Name</th>
                        <th className="border px-4 py-2">Türkçe Karşılığı</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(mappings).map(([key, value], index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                            <td className="border px-4 py-2">{key}</td>
                            <td className="border px-4 py-2">{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};



export default DetailNameTable; // Keep only one default export

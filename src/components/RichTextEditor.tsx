import React, { useRef, useMemo, useState, useEffect } from "react";
import JoditEditor from "jodit-react";

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: number;
    readonly?: boolean;
    maxLength?: number; // Dinamik karakter sınırı
    onLimitExceed?: (exceeded: boolean) => void; // Limit aşıldığında bildirim için callback
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Metninizi buraya yazın...",
    height = 300,
    readonly = false,
    maxLength = 400,
    onLimitExceed,
}) => {
    const editor = useRef(null);
    const [error, setError] = useState("");

    // Sadece bu component'e özel Rajdhani fontunu yükle
    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Rajdhani&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);
    const config = useMemo(
        () => ({
            readonly,
            toolbar: true,
            toolbarButtonSize: "middle" as "middle",
            showCharsCounter: false,
            showWordsCounter: false,
            placeholder,
            buttons: [
                "bold",
                "align", //
                "italic",
                "underline",
                "|",
                "ul",
                "ol",
                "|",
                "font",       // Font seçimi dropdown
                "fontsize",   // Yazı boyutu seçimi
                "|",
                "image",
                "link",
                "|",
                "source",
            ],
            height,
            uploader: { insertImageAsBase64URI: true },
            style: {
                fontFamily: "'Rajdhani', sans-serif", // Editörde varsayılan font
                fontSize: "16px",
            },
            controls: {
                font: {
                    list: {
                        "'Rajdhani', sans-serif": "Rajdhani",
                        "Arial,Helvetica,sans-serif": "Arial",
                        "Courier New,Courier,monospace": "Courier New",
                        "Georgia,serif": "Georgia",
                        "Tahoma,Geneva,sans-serif": "Tahoma",
                        "Times New Roman,Times,serif": "Times New Roman",
                        "Verdana,Geneva,sans-serif": "Verdana",
                    },
                },
            },
        }),
        [readonly, placeholder, height]
    );



    const handleChange = (content: string) => {
        const plainText = content.replace(/<[^>]*>/g, "").trim();

        if (maxLength && plainText.length > maxLength) {
            setError(`Maksimum ${maxLength} karakter sınırına ulaştınız!`);
            if (onLimitExceed) onLimitExceed(true);
        } else {
            setError("");
            if (onLimitExceed) onLimitExceed(false);
        }
        onChange(content);
    };

    const characterCount = value.replace(/<[^>]*>/g, "").trim().length;
    const isLimitExceeded = characterCount > maxLength;

    return (
        <div>
            <JoditEditor
                ref={editor}
                value={value}
                config={config}
                onBlur={handleChange}
                onChange={handleChange}
            />
            <div
                className={`text-right text-sm ${isLimitExceeded ? "text-red-500" : "text-gray-500"
                    }`}
            >
                {characterCount}/{maxLength}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default RichTextEditor;

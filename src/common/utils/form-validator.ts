import { BadRequestException } from '@nestjs/common';

interface FormField {
    key: string;
    label: string;
    required: boolean;
}

export function validateJawabanForm(formSchema: any, jawabanForm: Record<string, any> | null | undefined) {
    const fields: FormField[] = formSchema?.fields || [];

    for (const field of fields) {
        const val = jawabanForm ? jawabanForm[field.key] : undefined;
        if (field.required && !val) {
            throw new BadRequestException(`Field "${field.label}" wajib diisi`);
        }
    }
}
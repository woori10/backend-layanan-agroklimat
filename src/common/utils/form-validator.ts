import { BadRequestException } from '@nestjs/common';

interface FormField {
    key: string;
    label: string;
    required: boolean;
}

export function validateJawabanForm(formSchema: any, jawabanForm: Record<string, any>) {
    const fields: FormField[] = formSchema?.fields || [];

    for (const field of fields) {
        if (field.required && !jawabanForm[field.key]) {
            throw new BadRequestException(`Field "${field.label}" wajib diisi`);
        }
    }
}
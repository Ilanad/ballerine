import { getCountriesList } from '@app/components/organisms/KYBView/helpers/get-countries-list';
import { RJSFSchema } from '@rjsf/utils';

export const companyInformationSchema: RJSFSchema = {
  type: 'object',
  required: ['companyType'],
  properties: {
    registrationNumber: {
      title: 'Company Registration Number',
      type: 'string',
    },
    companyCountry: {
      title: 'Registered Country',
      type: 'string',
      oneOf: getCountriesList().map(countryData => ({
        const: countryData.isoCode,
        title: countryData.fullName,
      })),
    },
    state: {
      title: 'Jurisdiction / State',
      type: 'string',
      oneOf: [
        {
          title: 'Item',
          const: 'val',
        },
      ],
    },
    companyName: {
      title: 'Company Legal Name',
      type: 'string',
    },
    vat: {
      title: 'VAT Number',
      type: 'string',
    },
    companyType: {
      title: 'Company Type',
      type: 'string',
      oneOf: [
        {
          title: 'Sole Proprietorship',
          const: 'Sole Proprietorship',
        },
        {
          title: 'General Partnership (GP)',
          const: 'General Partnership (GP)',
        },
        {
          title: 'Limited Partnership (LP)',
          const: 'Limited Partnership (LP)',
        },
        {
          title: 'Limited Liability Partnership (LLP)',
          const: 'Limited Liability Partnership (LLP)',
        },
        {
          title: 'C Corporation (C Corp)',
          const: 'C Corporation (C Corp)',
        },
        {
          title: 'S Corporation (S Corp)',
          const: 'S Corporation (S Corp)',
        },
        { title: 'Professional Corporation (PC)', const: 'Professional Corporation (PC)' },
        { title: 'Incorporated (Inc.)', const: 'Incorporated (Inc.)' },
        {
          title: 'Limited Liability Company (LLC)',
          const: 'Limited Liability Company (LLC)',
        },
        { title: 'Public Limited Company (PLC)', const: 'Public Limited Company (PLC)' },
        {
          title: 'Private Limited Company (Ltd)',
          const: 'Private Limited Company (Ltd)',
        },
        { title: 'Co-operative (Co-op)', const: 'Co-operative (Co-op)' },
        {
          title: 'Business Trust',
          const: 'Business Trust',
        },
        {
          title: 'Joint Venture',
          const: 'Joint Venture',
        },
        {
          title: 'Unlimited Company',
          const: 'Unlimited Company',
        },
        {
          title: 'Trust',
          const: 'Trust',
        },
        {
          title: 'Holding Company',
          const: 'Holding Company',
        },
      ].sort((a, b) => a.title.localeCompare(b.title)),
    },
    establishmentDate: {
      title: 'Date of Establishment',
      type: 'string',
    },
  },
};

console.log('schema', companyInformationSchema);
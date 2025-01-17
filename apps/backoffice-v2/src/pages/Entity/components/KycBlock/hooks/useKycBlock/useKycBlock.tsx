import { TWorkflowById } from '../../../../../../domains/workflows/fetchers';
import { useStorageFilesQuery } from '../../../../../../domains/storage/hooks/queries/useStorageFilesQuery/useStorageFilesQuery';
import {
  convertSnakeCaseToTitleCase,
  omitPropsFromObject,
} from '../../../../hooks/useEntity/utils';
import { octetToFileType } from '../../../../../../common/octet-to-file-type/octet-to-file-type';
import { capitalize } from '../../../../../../common/utils/capitalize/capitalize';
import { safeEvery } from '@ballerine/common';

export const useKycBlock = ({
  parentWorkflowId,
  childWorkflow,
}: {
  childWorkflow: TWorkflowById['childWorkflows'][number];
  parentWorkflowId: string;
}) => {
  const docsData = useStorageFilesQuery(
    childWorkflow?.context?.documents?.flatMap(({ pages }) =>
      pages?.map(({ ballerineFileId }) => ballerineFileId),
    ),
  );
  const results: Array<Array<string>> = [];
  childWorkflow?.context?.documents?.forEach((document, docIndex) => {
    document?.pages?.forEach((page, pageIndex: number) => {
      if (!results[docIndex]) {
        results[docIndex] = [];
      }
      results[docIndex][pageIndex] = docsData?.shift()?.data;
    });
  });
  const decision = Object.keys(childWorkflow?.context?.pluginsOutput?.kyc_session ?? {})?.length
    ? Object.keys(childWorkflow?.context?.pluginsOutput?.kyc_session ?? {})?.flatMap(key => [
        {
          title: 'Verified With',
          value: capitalize(childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.vendor),
          type: 'text',
          format: 'text',
          pattern: '',
          isEditable: false,
          dropdownOptions: undefined,
        },
        {
          title: 'Result',
          value:
            childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.result?.decision?.decision
              ?.decision,
          type: 'text',
          format: 'text',
          pattern: '',
          isEditable: false,
          dropdownOptions: undefined,
        },
        {
          title: 'Issues',
          value: childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.decision?.decision
            ?.riskLabels?.length
            ? childWorkflow?.context?.pluginsOutput?.kyc_session[
                key
              ]?.decision?.decision?.riskLabels?.join(', ')
            : 'none',
          type: 'text',
          format: 'text',
          pattern: '',
          isEditable: false,
          dropdownOptions: undefined,
        },
        {
          title: 'Full report',
          value: childWorkflow?.context?.pluginsOutput?.kyc_session[key],
          type: 'text',
          format: 'text',
          pattern: '',
          isEditable: false,
          dropdownOptions: undefined,
        },
      ]) ?? []
    : [];
  const documentExtractedData = Object.keys(
    childWorkflow?.context?.pluginsOutput?.kyc_session ?? {},
  )?.length
    ? Object.keys(childWorkflow?.context?.pluginsOutput?.kyc_session ?? {})?.map(key => ({
        id: 'decision',
        type: 'details',
        value: {
          id: childWorkflow?.id,
          title: `Details`,
          data: Object.entries({
            ...childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.result?.entity?.data,
            ...omitPropsFromObject(
              childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.result?.documents?.[0]
                ?.properties,
              'issuer',
            ),
            issuer:
              childWorkflow?.context?.pluginsOutput?.kyc_session[key]?.result?.documents?.[0]
                ?.issuer?.country,
          })?.map(([title, value]) => ({
            title,
            value,
            type: 'text',
            format: 'text',
            pattern: '',
            isEditable: false,
            dropdownOptions: undefined,
          })),
        },
      })) ?? []
    : [];
  const details = Object.entries(childWorkflow?.context?.entity?.data).map(([title, value]) => ({
    title,
    value,
    type: 'text',
    format: 'text',
    pattern: '',
    isEditable: true,
    dropdownOptions: undefined,
  }));
  const documents = childWorkflow?.context?.documents?.flatMap(
    (document, docIndex) =>
      document?.pages?.map(({ type, metadata, data }, pageIndex) => ({
        title: `${convertSnakeCaseToTitleCase(document?.category)} - ${convertSnakeCaseToTitleCase(
          document?.type,
        )}${metadata?.side ? ` - ${metadata?.side}` : ''}`,
        imageUrl:
          type === 'pdf'
            ? octetToFileType(results[docIndex][pageIndex], `application/${type}`)
            : results[docIndex][pageIndex],
        fileType: type,
      })) ?? [],
  );
  const hasDecision = safeEvery(
    childWorkflow?.context?.documents,
    document => !!document?.decision?.status,
  );

  return [
    [
      {
        id: 'header',
        type: 'container',
        value: [
          {
            type: 'heading',
            value: `${childWorkflow?.context?.entity?.data?.firstName} ${childWorkflow?.context?.entity?.data?.lastName}`,
          },
          {
            id: 'actions',
            type: 'container',
            value: [
              {
                type: 'caseCallToAction',
                value: 'Reject',
                data: {
                  parentWorkflowId: parentWorkflowId,
                  childWorkflowId: childWorkflow?.id,
                  childWorkflowContextSchema: childWorkflow?.workflowDefinition?.contextSchema,
                  disabled: hasDecision,
                  approvalStatus: 'rejected',
                },
              },
              {
                type: 'caseCallToAction',
                value: 'Approve',
                data: {
                  parentWorkflowId: parentWorkflowId,
                  childWorkflowId: childWorkflow?.id,
                  childWorkflowContextSchema: childWorkflow?.workflowDefinition?.contextSchema,
                  disabled: hasDecision,
                  approvalStatus: 'approved',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'kyc-block',
        type: 'container',
        value: [
          {
            type: 'container',
            value: [
              {
                type: 'container',
                value: [
                  {
                    id: 'header',
                    type: 'heading',
                    value: 'Details',
                  },
                  {
                    id: 'decision',
                    type: 'details',
                    value: {
                      id: 1,
                      title: `Details`,
                      data: details,
                    },
                  },
                ],
              },
              {
                type: 'container',
                value: [
                  {
                    id: 'header',
                    type: 'heading',
                    value: 'Document Extracted Data',
                  },
                  ...documentExtractedData,
                ],
              },
              {
                type: 'container',
                value: [
                  {
                    id: 'header',
                    type: 'heading',
                    value: 'Document Verification Results',
                  },
                  {
                    id: 'decision',
                    type: 'details',
                    value: {
                      id: 1,
                      title: `Decision`,
                      data: decision,
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'multiDocuments',
            value: {
              isLoading: docsData?.some(({ isLoading }) => isLoading),
              data: documents,
            },
          },
        ],
      },
    ],
  ];
};

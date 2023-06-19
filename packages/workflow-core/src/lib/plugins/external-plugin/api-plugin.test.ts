import { beforeEach, afterEach, describe, expect, it, test } from 'vitest';
import { WorkflowRunner } from '../../workflow-runner';

function createWorkflowRunner(
  definition: {
    initial: string;
    states: {
      initial: { on: { CHECK_BUSINESS_SCORE: { target: string } } };
      checkBusinessScoreSuccess: { type: string };
      checkBusinessScore: { on: { API_CALL_SUCCESS: string } };
    };
  },
  apiPluginsSchemas: {
    stateNames: string[];
    request: { transform: { mapping: string; transformer: string } };
    method: string;
    successAction: string;
    response: { transform: { mapping: string; transformer: string } };
    name: string;
    errorAction: string;
    url: string;
  }[],
) {
  return new WorkflowRunner({
    definition,
    extensions: {
      externalPlugins: { apiPluginsSchemas },
    },
    workflowContext: { machineContext: { entity: { id: 'some_id' } } },
  });
}

describe('workflow-runner', () => {
  describe('api plugins', () => {
    const definition = {
      initial: 'initial',
      states: {
        initial: {
          on: {
            CHECK_BUSINESS_SCORE: {
              target: 'checkBusinessScore',
            },
          },
        },
        checkBusinessScore: {
          on: {
            API_CALL_SUCCESS: 'checkBusinessScoreSuccess',
            API_CALL_FAILURE: 'testManually',
          },
        },
        checkBusinessScoreSuccess: {
          type: 'final',
        },
        testManually: {
          type: 'final',
        },
      },
    };

    let apiPluginsSchemas = [
      {
        name: 'ballerineEnrichment',
        url: 'https://simple-kyb-demo.s3.eu-central-1.amazonaws.com/mock-data/business_test_us.json',
        method: 'GET',
        stateNames: ['checkBusinessScore'],
        successAction: 'API_CALL_SUCCESS',
        errorAction: 'API_CALL_FAILURE',
        request: {
          transform: {
            transformer: 'jq',
            mapping: '{data: .entity.id}',
          },
        },
        response: {
          transform: { transformer: 'jq', mapping: '{result: .}' },
        },
      },
    ];

    describe('when api plugin tranforms and makes a request to an external api', () => {
      const workflow = createWorkflowRunner(definition, apiPluginsSchemas);
      it('it transitions to successAction and persist response to context', async () => {
        await workflow.sendEvent('CHECK_BUSINESS_SCORE');

        expect(workflow.state).toEqual('checkBusinessScoreSuccess');
        expect(workflow.context).toEqual({
          ballerineEnrichment: {
            result: {
              companyInfo: {
                companyName: 'TestCorp Ltd',
                industry: 'Software',
                location: 'New York, USA',
                country: 'US',
                yearEstablished: 1995,
                numberOfEmployees: 500,
                ceo: 'John Doe',
                products: ['Product A', 'Product B', 'Product C'],
                website: 'www.testcorpltd.com',
              },
            },
          },
          entity: { id: 'some_id' },
        });
      });
    });

    describe('when api invalid jq transformation of request', () => {
      const apiPluginsSchemasCopy = structuredClone(apiPluginsSchemas);
      apiPluginsSchemasCopy[0].request.transform.mapping = 'dsa: .unknwonvalue.id}';
      const workflow = createWorkflowRunner(definition, apiPluginsSchemasCopy);

      it('it returns error for transformation and transition to testManually', async () => {
        await workflow.sendEvent('CHECK_BUSINESS_SCORE');

        expect(workflow.state).toEqual('testManually');
        expect(workflow.context).toEqual({
          entity: { id: 'some_id' },
          ballerineEnrichment: {
            error:
              'Error transforming data: write EPIPE for transformer mapping: dsa: .unknwonvalue.id}',
          },
        });
      });
    });

    describe('when api plugin has schema', () => {
      describe('when api request invalid for schema', () => {
        const apiPluginsSchemasCopy = structuredClone(apiPluginsSchemas);
        apiPluginsSchemasCopy[0].request.schema = {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            business_name: {
              type: 'string',
            },
            registration_number: {
              type: 'string',
            },
          },
          required: ['business_name', 'registration_number'],
        };
        const workflow = createWorkflowRunner(definition, apiPluginsSchemasCopy);

        it('it returns error for transformation and transition to testManually', async () => {
          await workflow.sendEvent('CHECK_BUSINESS_SCORE');

          expect(workflow.state).toEqual('testManually');
          expect(workflow.context).toEqual({
            entity: {id: 'some_id'},
            ballerineEnrichment: {
              error: '',
            },
          });
        });
      });
    });
  });
});
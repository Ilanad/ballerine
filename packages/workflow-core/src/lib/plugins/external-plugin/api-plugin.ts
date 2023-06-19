import { TContext, TTransformers, TValidators } from '../../utils/types';
import { AnyRecord } from '@ballerine/common';
import fetch from 'node-fetch';

export interface ApiPluginParams {
  name: string;
  stateNames: Array<string>;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  request: { transformer: TTransformers; schemaValidator?: TValidators };
  response: { transformer: TTransformers; schemaValidator?: TValidators };
  headers?: HeadersInit;
  successAction: string;
  errorAction: string;
}
export class ApiPlugin {
  name: string;
  stateNames: Array<string>;
  url: string;
  method: ApiPluginParams['method'];
  headers: ApiPluginParams['headers'];
  request: ApiPluginParams['request'];
  response: ApiPluginParams['response'];
  successAction: string;
  errorAction: string;

  constructor(pluginParams: ApiPluginParams) {
    this.name = pluginParams.name;
    this.stateNames = pluginParams.stateNames;
    this.url = pluginParams.url;
    this.method = pluginParams.method;
    this.headers = pluginParams.headers || { 'Content-Type': 'application/json' };
    this.request = pluginParams.request;
    this.response = pluginParams.response;
    this.successAction = pluginParams.successAction;
    this.errorAction = pluginParams.errorAction;
  }
  async callApi(context: TContext) {
    try {
      const requestPayload = await this.transformData(this.request.transformer, context);
      const { isRequestValid, errorMessage } = await this.validateRequest(
        requestPayload as AnyRecord,
      );
      if (!isRequestValid) return this.returnErrorResponse(errorMessage!);

      const apiResponse = await this.makeApiRequest(
        this.url,
        this.method,
        requestPayload,
        this.headers,
      );

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        const responseBody = await this.transformData(
          this.response.transformer,
          result as AnyRecord,
        );

        const { isResponseValid, errorMessage } = await this.validateResponse(responseBody);
        if (!isResponseValid) return this.returnErrorResponse(errorMessage!);

        return { callbackAction: this.successAction, responseBody };
      } else {
        return this.returnErrorResponse('Request Failed: ' + apiResponse.statusText);
      }
    } catch (error) {
      return this.returnErrorResponse(error.message);
    }
  }

  returnErrorResponse(errorMessage: string) {
    return { callbackAction: this.errorAction, error: errorMessage };
  }

  async makeApiRequest(
    url: string,
    method: ApiPlugin['method'],
    payload: AnyRecord,
    headers: HeadersInit,
  ) {
    let requestParams: {} = {
      method: method,
      headers: headers,
    };

    if (this.method.toUpperCase() === 'POST') {
      requestParams.body = JSON.stringify(payload);
    } else if (this.method.toUpperCase() === 'GET' && payload) {
      const queryParams = new URLSearchParams(payload).toString();
      url = `${this.url}?${queryParams}`;
    }

    return await fetch(url, requestParams);
  }

  async transformData(transformer: TTransformers, record: AnyRecord) {
    try {
      return (await transformer.transform(record, { input: 'json', output: 'json' })) as AnyRecord;
    } catch (error) {
      throw new Error(
        `Error transforming data: ${error.message} for transformer mapping: ${transformer.mapping}`,
      );
    }
  }

  async validateRequest(transformedRequest: AnyRecord) {
    if (!this.request.schemaValidator) return { isRequestValid: true };

    const { isValid, errorMessage } = await this.request.schemaValidator.validate(
      transformedRequest,
    );
    return { isRequestValid: isValid, errorMessage };
  }
  async validateResponse(transformedResponse: AnyRecord) {
    if (!this.response.postTransformSchema) return { isResponseValid: true };

    const { isValid, errorMessage } = await this.response.postTransformSchema.validate(
      transformedResponse,
    );
    return { isResponseValid: isValid, errorMessage };
  }
}
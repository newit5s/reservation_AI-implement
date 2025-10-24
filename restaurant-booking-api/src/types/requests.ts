import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { AuthUser } from './auth';

export interface AuthenticatedRequest<
  TParams extends ParamsDictionary = ParamsDictionary,
  TResBody = unknown,
  TReqBody = unknown,
  TQuery extends ParsedQs = ParsedQs,
> extends Request<TParams, TResBody, TReqBody, TQuery> {
  user: AuthUser;
}

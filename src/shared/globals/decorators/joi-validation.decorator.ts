/* eslint-disable @typescript-eslint/no-explicit-any */
import { JoiRequestValidationError } from '@global/helpers/error-handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';

type IjoiDecorator = ( target: any, key: string, descriptor: PropertyDescriptor ) => void;

export function joiValidation(schema: ObjectSchema): IjoiDecorator {
  return (_target: any, _key: string, descriptor: PropertyDescriptor ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];
      // validateAsync 또는 validate 둘다 사용가능 
      const { error } = await Promise.resolve(schema.validate(req.body));
      if ( error?.details) {
        throw new JoiRequestValidationError(error.details[0].message);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

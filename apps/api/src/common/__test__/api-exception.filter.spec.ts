import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiExceptionFilter } from '../api-exception.filter';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  function createHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
      json,
      status,
    };
  }

  it('returns envelope with business code on unauthorized', () => {
    const host = createHost();
    filter.catch(new UnauthorizedException('Invalid email or password'), host as never);

    expect(host.status).toHaveBeenCalledWith(200);
    expect(host.json).toHaveBeenCalledWith({
      code: 401,
      message: 'Invalid email or password',
      data: null,
    });
  });

  it('flattens validation messages', () => {
    const host = createHost();
    filter.catch(
      new BadRequestException({
        message: ['email must be an email', 'password should not be empty'],
      }),
      host as never,
    );

    expect(host.json).toHaveBeenCalledWith({
      code: 400,
      message: 'email must be an email, password should not be empty',
      data: null,
    });
  });
});

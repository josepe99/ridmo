import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface BaseControllerOptions {
  validation?: z.ZodSchema;
}

export abstract class BaseController {
  protected async handleRequest(
    request: NextRequest,
    handler: (request: NextRequest, data?: any) => Promise<NextResponse>,
    options: BaseControllerOptions = {}
  ): Promise<NextResponse> {
    try {
      // Input validation
      let validatedData;
      if (options.validation) {
        const body = await this.parseRequestBody(request);
        const validationResult = options.validation.safeParse(body);
        
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: 'Validation failed', 
              details: validationResult.error.errors 
            },
            { status: 400 }
          );
        }
        validatedData = validationResult.data;
      }

      // Execute handler
      return await handler(request, validatedData);
    } catch (error) {
      console.error('Controller error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  protected async parseRequestBody(request: NextRequest): Promise<any> {
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        return await request.json();
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const data: Record<string, any> = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });
        return data;
      } else if (contentType?.includes('multipart/form-data')) {
        return await request.formData();
      }
      
      return {};
    } catch (error) {
      console.error('Error parsing request body:', error);
      return {};
    }
  }

  protected async checkAuthentication(request: NextRequest): Promise<{ success: boolean; user?: any }> {
    // Authentication removed since orders are handled via WhatsApp
    return { success: true };
  }

  protected createSuccessResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data
    }, { status });
  }

  protected createErrorResponse(message: string, status: number = 400): NextResponse {
    return NextResponse.json({
      success: false,
      error: message
    }, { status });
  }

  // HTTP Method handlers
  async GET(request: NextRequest): Promise<NextResponse> {
    return this.createErrorResponse('Method not implemented', 501);
  }

  async POST(request: NextRequest): Promise<NextResponse> {
    return this.createErrorResponse('Method not implemented', 501);
  }

  async PUT(request: NextRequest): Promise<NextResponse> {
    return this.createErrorResponse('Method not implemented', 501);
  }

  async PATCH(request: NextRequest): Promise<NextResponse> {
    return this.createErrorResponse('Method not implemented', 501);
  }

  async DELETE(request: NextRequest): Promise<NextResponse> {
    return this.createErrorResponse('Method not implemented', 501);
  }
}

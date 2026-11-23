import { type ArgumentsHost, Catch, type ExceptionFilter, PayloadTooLargeException } from "@nestjs/common";
import type { Request, Response } from "express";

/** An upload over its limit answers in the same `{ code, message }` shape as every other error. */
@Catch(PayloadTooLargeException)
export class FileTooBig implements ExceptionFilter {
  catch(_error: PayloadTooLargeException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const file = /multipart\/form-data/i.test(http.getRequest<Request>().headers["content-type"] ?? "");
    http
      .getResponse<Response>()
      .status(413)
      .json(file ? { code: "FILE_TOO_BIG", message: "파일이 너무 커요. 10MB까지 올릴 수 있어요. 사진은 크기를 줄이고, PDF는 쪽을 나눠 올려 주세요." } : { code: "TOO_BIG", message: "보낸 내용이 너무 커요. 나눠서 보내 주세요." });
  }
}

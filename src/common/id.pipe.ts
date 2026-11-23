import { BadRequestException, ParseIntPipe } from "@nestjs/common";

/** `@Param("id", IdPipe)`: a number in the address, or a plain Korean answer. */
export const IdPipe = new ParseIntPipe({ exceptionFactory: () => new BadRequestException({ code: "BAD_ID", message: "주소가 올바르지 않아요. 목록에서 다시 골라 주세요." }) });

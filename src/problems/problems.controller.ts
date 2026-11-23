import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { IdPipe } from "../common/id.pipe.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { Ws } from "../workspace/workspace.js";
import { ProblemBulk, ProblemInput, ProblemQuery } from "./problem.dto.js";
import { ProblemsService } from "./problems.service.js";

@Controller("problems")
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}

  @Get()
  list(@Ws() ws: string, @Query(new ZodPipe(ProblemQuery)) query: ProblemQuery) {
    return this.problems.list(ws, query);
  }

  @Get("facets")
  facets(@Ws() ws: string) {
    return this.problems.facets(ws);
  }

  /** The worksheets this problem is on (shown before deleting it). */
  @Get(":id/sheets")
  async sheets(@Ws() ws: string, @Param("id", IdPipe) id: number) {
    await this.problems.get(ws, id);
    return (await this.problems.inSheets(ws, id)).map((s) => ({ id: s.id, title: s.title }));
  }

  @Get(":id")
  get(@Ws() ws: string, @Param("id", IdPipe) id: number) {
    return this.problems.get(ws, id);
  }

  @Post()
  create(@Ws() ws: string, @Body(new ZodPipe(ProblemInput)) body: ProblemInput) {
    return this.problems.create(ws, body);
  }

  /** Saves several at once (the drafts picked on the 가져오기 screen). */
  @Post("bulk")
  bulk(@Ws() ws: string, @Body(new ZodPipe(ProblemBulk)) body: ProblemBulk) {
    return this.problems.createMany(ws, body.problems);
  }

  @Put(":id")
  update(@Ws() ws: string, @Param("id", IdPipe) id: number, @Body(new ZodPipe(ProblemInput)) body: ProblemInput) {
    return this.problems.update(ws, id, body);
  }

  @Delete(":id")
  remove(@Ws() ws: string, @Param("id", IdPipe) id: number) {
    return this.problems.remove(ws, id);
  }
}

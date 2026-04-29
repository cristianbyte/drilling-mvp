import { Operator } from "../entities/entities";

export interface IOperatorRepository {
  fetchAll(): Promise<Operator[]>;
  fetchById(id: string): Promise<Operator | null>;
  create(data: Omit<Operator, "id" | "createdAt">): Promise<string | null>;
}

import { Leader } from "../entities/entities";

export interface ILeaderRepository {
  fetchAll(): Promise<Leader[]>;
  fetchById(id: string): Promise<Leader | null>;
  create(name: string): Promise<string | null>;
}

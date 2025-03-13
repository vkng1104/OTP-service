import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp with time zone", nullable: true })
  updated_at: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  deleted_at: Date;
}

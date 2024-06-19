import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'parse_log' })
export class ParseEntity extends BaseEntity {
  @Column({ unique: true, comment: '解析ID', nullable: true })
  id: number;

  @Column({ comment: '请求消息', nullable: true })
  messages: string;

  @Column({ comment: '解析结果' })
  result: string;

  @Column({ comment: '模型', nullable: true })
  model: string;

  @Column({ comment: '用户ID', nullable: true })
  userId: number;

  @Column({ comment: '创建时间' })
  createdAt: Date;

  @Column({ comment: '更新时间' })
  updatedAt: Date;
}

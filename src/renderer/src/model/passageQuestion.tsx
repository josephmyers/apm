import { RecordRelationship, InitializedRecord } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface PassageQuestion extends BaseModel {
  attributes: {
    title: string;
    speaker: string;
    segmentStart: number;
    segmentEnd: number;
    audioPath: string;
    duration: number;
    sequencenum: number;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    passage: RecordRelationship;
    mediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type PassageQuestionD = PassageQuestion & InitializedRecord;

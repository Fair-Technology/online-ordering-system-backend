export interface GetGoLiveStatusRequestDto {
  shopId: string;
}

export interface GoLiveCriterion {
  key: string;
  met: boolean;
  description: string;
}

export interface GetGoLiveStatusResultDto {
  allMet: boolean;
  criteria: GoLiveCriterion[];
}

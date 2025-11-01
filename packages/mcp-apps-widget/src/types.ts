export type WidgetMetaData = {
  'openai/outputTemplate'?: string;
  'openai/toolInvocation/invoking'?: string;
  'openai/toolInvocation/invoked'?: string;
  'openai/widgetAccessible'?: boolean;
  'openai/resultCanProduceWidget'?: boolean;
};

export type StoreWidgetPayload<
  TToolOutput = unknown,
  TMetadata = WidgetMetaData | Record<string, unknown> | null
> = {
  html: string;
  toolOutput?: TToolOutput;
  toolResponseMetadata: TMetadata;
};

export type WidgetData<
  TToolOutput = unknown,
  TMetadata = WidgetMetaData | Record<string, unknown> | null
> = StoreWidgetPayload<TToolOutput, TMetadata> & {
  timestamp: number;
};

export type StoreWidgetResult = {
  id?: string;
  src?: string;
};


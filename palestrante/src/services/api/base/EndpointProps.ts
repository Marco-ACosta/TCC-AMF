export type RequestHeader = {
  [key: string]: string;
};

export type RequestProps = {
  url: string;
  headers?: RequestHeader[];
  authorization?: string;
};

export type GetProps = RequestProps;

export type SendRequestProps = {
  body?: any;
  isBodyFormData?: boolean;
} & RequestProps;

export type PostProps = {
  method?: "POST" | "PUT" | "DELETE";
} & SendRequestProps;

export type PutProps = SendRequestProps;

export type DeleteProps = SendRequestProps;

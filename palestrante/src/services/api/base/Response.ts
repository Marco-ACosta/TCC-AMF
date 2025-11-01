type ResponseProps = {
  data: any;
  status: number;
  fetchError?: string;
};

export default class Response<T> {
  Status: number;

  Success: boolean;

  Data: T;

  ErrorMessage?: string;

  constructor({ data, status, fetchError }: ResponseProps) {
    this.Status = status;
    this.Success = status < 400;
    this.Data = data;
    this.ErrorMessage = fetchError ? fetchError : data;
  }
}

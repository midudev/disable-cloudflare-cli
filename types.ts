export interface Zone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
}

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
}

export interface CloudflareResponse<T> {
  success: boolean;
  errors?: Array<{ message: string }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

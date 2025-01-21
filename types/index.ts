export interface LinkedInData {
  text: string;
  url?: string;
  image?: string;
  title?: string;
  [key: string]: any;
}

export interface CompanyMapData {
  companyName: string;
  rootNode: {
    title: string;
    children: Array<{
      title: string;
      description: string;
      children: Array<{
        title: string;
        description: string;
      }>;
    }>;
  };
} 
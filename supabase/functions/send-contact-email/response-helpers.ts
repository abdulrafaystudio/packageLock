
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const createCorsResponse = () => {
  return new Response(null, { headers: corsHeaders });
};

export const createErrorResponse = (status: number, error: string, message?: string) => {
  return new Response(
    JSON.stringify({ 
      error,
      message: message || error
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
};

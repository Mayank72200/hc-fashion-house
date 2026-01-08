from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class HttpErrorResponse(BaseModel):
    Error: Annotated[str, Field(pattern="^.*$", max_length=100000)]
    model_config = ConfigDict(extra='forbid')

class HttpErrorResponseDetail(BaseModel):
    detail: Annotated[str, Field(pattern="^.*$", max_length=100000)]
    model_config = ConfigDict(extra='forbid')
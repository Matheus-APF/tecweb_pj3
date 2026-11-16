from typing import Annotated, Literal
from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    model_validator,
)


def clean_lower(value: object) -> object:
    if isinstance(value, str):
        return value.strip().lower()
    return value


def clean_upper(value: object) -> object:
    if isinstance(value, str):
        return value.strip().upper()
    return value


PriorityType = Annotated[
    Literal["low", "medium", "high"],
    BeforeValidator(clean_lower),
]

SizeType = Annotated[
    Literal["XS", "S", "M", "L", "XL"],
    BeforeValidator(clean_upper),
]


class PlannedTask(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=1500)
    priority: PriorityType
    size: SizeType
    estimated_hours: float = Field(gt=0, le=40)
    order: int = Field(ge=1, le=12)


class GeneratedPlan(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=200)
    tasks: list[PlannedTask] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def validate_and_sort_tasks(self) -> "GeneratedPlan":
        orders = [task.order for task in self.tasks]
        if len(orders) != len(set(orders)):
            raise ValueError("As tarefas possuem valores de 'order' duplicados.")

        self.tasks.sort(key=lambda t: t.order)
        return self
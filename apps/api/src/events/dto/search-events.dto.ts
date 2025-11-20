import { IsOptional, IsString, IsDateString, IsArray, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchEventsDto {
    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',');
        return [value];
    })
    distances?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',');
        return [value];
    })
    types?: string[];

    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 10;
}

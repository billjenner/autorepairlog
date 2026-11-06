-- delete scenario

select
    *
from auto

select auto_id
from auto
where make = 'Lexus'
and model = '350NX'


-- delete linked service_log records
delete
from service_log
where service_id in (
    SELECT service_id
    FROM public.service
    WHERE schedule_id IN (
        select
            schedule_id
        from schedule
        where auto_id = 8
    )
);

-- delete linked service records
delete
FROM public.service
WHERE schedule_id IN (
    select
        schedule_id
    from schedule
    where auto_id = 8
);

-- delete linked shedule records
delete
from schedule
where auto_id = 8

-- delete auto (or do it from the GUI)
delete
from auto
where make = 'Lexus'
and model = '350NX'


-- check up on records
select 
    s.*,
    a.* 
from Schedule s
join auto a on s.auto_id = a.auto_id
where a.auto_id = 8
order by s.created_date desc
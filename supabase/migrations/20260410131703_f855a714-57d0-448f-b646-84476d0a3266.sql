INSERT INTO persons (person_id,personnummer,first_name,middle_name,last_name,gender,birth_date,birth_country,civil_status,address,postal_code,city,county_code,municipality_code,parish_code,district_code,region,municipality,pnr_type,protected_identity,is_fictitious,is_bookable,is_static) VALUES
('192101108814','192101108814','Anna Birgitta',NULL,'Andersson','Kvinna','1921-01-10',NULL,'Ä',NULL,'17853','EKERÖ','1','25','99',NULL,'1','EKERÖ','P',false,false,true,false),
('192101128806','192101128806','Lars',NULL,'Eriksson','Man','1921-01-12',NULL,'Ä',NULL,'17853','EKERÖ','1','25','99',NULL,'1','EKERÖ','P',false,false,true,false),
('192102088830','192102088830','Erik Hjalmar',NULL,'Svensson','Man','1921-02-08',NULL,'Ä',NULL,'11625','STOCKHOLM','1','80','99','101036','1','STOCKHOLM','P',false,false,true,false),
('192102108821','192102108821','Margit Elsa',NULL,'Olsson','Kvinna','1921-02-10',NULL,'Ä',NULL,'17962','STENHAMRA','1','25','99',NULL,'1','STENHAMRA','P',false,false,true,false),
('192103098818','192103098818','Margit Birgit',NULL,'Gustafsson','Kvinna','1921-03-09',NULL,'Ä',NULL,'11223','STOCKHOLM','1','80','99','101157','1','STOCKHOLM','P',false,false,true,false),
('192104078851','192104078851','Karl Ragnvald',NULL,'Pettersson','Man','1921-04-07',NULL,'Ä',NULL,'11543','STOCKHOLM','1','80','99',NULL,'1','STOCKHOLM','P',false,false,true,false),
('192104108832','192104108832','Maj',NULL,'Pettersson','Kvinna','1921-04-10',NULL,'Ä',NULL,'11543','STOCKHOLM','1','80','99',NULL,'1','STOCKHOLM','P',false,false,true,false)
ON CONFLICT (person_id) DO NOTHING;
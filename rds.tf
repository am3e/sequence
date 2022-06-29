resource "aws_subnet" "rds" {
  count                   = length(data.aws_availability_zones.available.names)
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.${length(data.aws_availability_zones.available.names) + count.index}.0/24"
  map_public_ip_on_launch = true
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  tags = {
    Name = "rds-${element(data.aws_availability_zones.available.names, count.index)}"
  }
}

resource "aws_db_subnet_group" "default" {
  name        = "terraform-mysql-subnet-group"
  description = "Terraform example RDS subnet group"
  subnet_ids  = aws_subnet.rds.*.id
}

resource "aws_security_group" "rds" {
  name        = "terraform_rds_security_group"
  description = "Terraform RDS MySQL server"
  vpc_id      = aws_vpc.app_vpc.id
  # Keep the instance private by only allowing traffic from the web server.
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = ["${aws_security_group.default.id}"]
  }
  # Allow all outbound traffic.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "terraform-rds-security-group"
  }
}

resource "aws_db_instance" "default" {
  identifier                = "sequence-rds-instance-identifier"
  allocated_storage         = 5
  engine                    = "mysql"
  engine_version            = "5.7"
  instance_class            = "db.t2.micro"
  db_name                   = "Sequence"
  username                  = "sequence"
  password                  = "sequence"
  db_subnet_group_name      = aws_db_subnet_group.default.id
  vpc_security_group_ids    = [aws_security_group.rds.id]
  skip_final_snapshot       = true
  final_snapshot_identifier = "Ignore"
}

resource "aws_db_parameter_group" "default" {
  name        = "sequence-rds-instance-identifier-param-group"
  description = "Terraform parameter group for mysql5.6"
  family      = "mysql5.6"
  parameter {
    name  = "character_set_server"
    value = "utf8"
  }
  parameter {
    name  = "character_set_client"
    value = "utf8"
  }
}
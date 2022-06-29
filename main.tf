terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "app_server" {
  ami           = "ami-0022f774911c1d690"
  instance_type = "t2.micro"
  key_name= "aws_key"
    connection {
        type        = "ssh"
        host        = self.public_ip
        user        = "admin"
        private_key = file("~/.ssh/aws_key")
        timeout     = "4m"
    }
  subnet_id = aws_subnet.main[0].id
  tags = {
    Name = "Sequence"
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "aws_key"
  public_key = file("~/.ssh/aws_key.pub")
}

resource "aws_vpc" "app_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "terraform-sequence-vpc"
  }
}

resource "aws_internet_gateway" "app_gateway" {
  vpc_id = aws_vpc.app_vpc.id

  tags = {
    Name = "terraform-app-internet-gateway"
  }
}

resource "aws_route" "route" {
  route_table_id         = aws_vpc.app_vpc.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.app_gateway.id
}

resource "aws_subnet" "main" {
  count                   = length(data.aws_availability_zones.available.names)
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.${count.index}.0/24"
  map_public_ip_on_launch = true
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)

  tags = {
    Name = "public-${element(data.aws_availability_zones.available.names, count.index)}"
  }
}

resource "aws_security_group" "default" {
  name        = "terraform_security_group"
  description = "Terraform example security group"
  vpc_id      = aws_vpc.app_vpc.id

  # Allow outbound internet access.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "terraform-example-security-group"
  }
}

resource "aws_security_group" "lb" {
  name        = "terraform_lb_security_group"
  description = "Terraform load balancer security group"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["99.99.99.0/24"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["99.99.99.0/24"]
  }

  ingress { 
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["99.99.99.0/24"]
  }

  # Allow all outbound traffic.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "terraform-lb-security-group"
  }
}

resource "aws_lb" "app_lb" {
  name               = "sequence-lb-tf"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = aws_subnet.main.*.id
  
  tags = {
      Name = "terraform-example-lb"
    }
  
}

resource "aws_lb_target_group_attachment" "ec_instance" {
  target_group_arn = aws_lb_target_group.app_server_wss.arn
  target_id        = aws_instance.app_server.id
  port             = 80
}

resource "aws_lb_target_group" "app_server_wss" {
  name     = "app-server-lb-target"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.app_vpc.id
  stickiness {
    type = "lb_cookie"
  }
  # Alter the destination of the health check to be the login page.
  health_check {
    path = "/"
    port = 80
    matcher = 426
  }
}

resource "aws_lb_listener" "listener_https" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-1:725445055643:certificate/24731f5d-8c2c-4cf0-aca3-a05024387864"
  default_action {
    target_group_arn = aws_lb_target_group.app_server_wss.arn
    type             = "forward"
  }
}

resource "aws_route53_record" "server_sequence" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "server.sequence.am3e.dev"
  type    = "A"
  alias {
      name                      = aws_lb.app_lb.dns_name
      zone_id                   = aws_lb.app_lb.zone_id
      evaluate_target_health    = true
  }
}
